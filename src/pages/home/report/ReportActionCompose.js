import React from 'react';
import PropTypes from 'prop-types';
import {View, Image, TouchableOpacity} from 'react-native';
import _ from 'underscore';
import styles, {colors} from '../../../styles/StyleSheet';
import TextInputFocusable from '../../../components/TextInputFocusable';
import sendIcon from '../../../../assets/images/icon-send.png';
import IONKEYS from '../../../IONKEYS';
import paperClipIcon from '../../../../assets/images/icon-paper-clip.png';
import ImagePicker from '../../../libs/ImagePicker';
import withIon from '../../../components/withIon';
import {addAction, saveReportComment} from '../../../libs/actions/Report';

const propTypes = {
    // A method to call when the form is submitted
    onSubmit: PropTypes.func.isRequired,

    // The comment left by the user
    comment: PropTypes.string,

    // The ID of the report actions will be created for
    reportID: PropTypes.number.isRequired,
};

const defaultProps = {
    comment: '',
};

class ReportActionCompose extends React.Component {
    constructor(props) {
        super(props);

        this.updateComment = this.updateComment.bind(this);
        this.debouncedSaveReportComment = _.debounce(this.debouncedSaveReportComment.bind(this), 1000, false);
        this.submitForm = this.submitForm.bind(this);
        this.triggerSubmitShortcut = this.triggerSubmitShortcut.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.showAttachmentPicker = this.showAttachmentPicker.bind(this);
        this.setIsFocused = this.setIsFocused.bind(this);
        this.comment = '';
        this.state = {
            isFocused: false,
            textInputShouldClear: false
        };
    }

    componentDidUpdate(prevProps) {
        // The first time the component loads the props is empty and the next time it may contain value.
        // If it does let's update this.comment so that it matches the defaultValue that we show in textInput.
        if (this.props.comment && prevProps.comment === '' && prevProps.comment !== this.props.comment) {
            this.comment = this.props.comment;
        }
    }

    /**
     * Updates the Highlight state of the composer
     *
     * @param {boolean} shouldHighlight
     */
    setIsFocused(shouldHighlight) {
        this.setState({isFocused: shouldHighlight});
    }

    /**
     * Updates the should clear state of the composer
     *
     * @param {boolean} shouldClear
     */
    setTextInputShouldClear(shouldClear) {
        this.setState({textInputShouldClear: shouldClear});
    }

    /**
     * Save our report comment in Ion. We debounce this method in the constructor so that it's not called too often
     * to update Ion and re-render this component.
     *
     * @param {string} comment
     */
    debouncedSaveReportComment(comment) {
        saveReportComment(this.props.reportID, comment || '');
    }

    /**
     * Update the value of the comment in Ion
     *
     * @param {string} newComment
     */
    updateComment(newComment) {
        this.setTextInputShouldClear(false);
        this.comment = newComment;
        this.debouncedSaveReportComment(newComment);
    }

    /**
     * Listens for the keyboard shortcut and submits
     * the form when we have enter
     *
     * @param {Object} e
     */
    triggerSubmitShortcut(e) {
        if (e && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.submitForm();
        }
    }

    /**
     * Add a new comment to this chat
     *
     * @param {SyntheticEvent} [e]
     */
    submitForm(e) {
        if (e) {
            e.preventDefault();
        }

        const trimmedComment = this.comment.trim();

        // Don't submit empty comments
        if (!trimmedComment) {
            return;
        }

        this.props.onSubmit(trimmedComment);
        this.setTextInputShouldClear(true);
        this.updateComment('');
    }

    /**
     * Handle the attachment icon being tapped
     *
     * @param {SyntheticEvent} e
     */
    showAttachmentPicker(e) {
        e.preventDefault();

        /**
         * See https://github.com/react-native-community/react-native-image-picker/blob/master/docs/Reference.md#options
         * for option definitions
         */
        const options = {
            storageOptions: {
                skipBackup: true,
            },
        };

        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
                return;
            }

            if (response.error) {
                console.error(`Error occurred picking image: ${response.error}`);
                return;
            }

            addAction(this.props.reportID, '', ImagePicker.getDataForUpload(response));
            this.textInput.focus();
        });
    }

    render() {
        return (
            <View style={[styles.chatItemCompose]}>
                <View style={[
                    this.state.isFocused ? styles.chatItemComposeBoxFocusedColor : styles.chatItemComposeBoxColor,
                    styles.chatItemComposeBox,
                    styles.flexRow
                ]}
                >
                    <TouchableOpacity
                        onPress={this.showAttachmentPicker}
                        style={[styles.chatItemAttachButton]}
                        underlayColor={colors.componentBG}
                    >
                        <Image
                            style={[styles.chatItemSubmitButtonIcon]}
                            resizeMode="contain"
                            source={paperClipIcon}
                        />
                    </TouchableOpacity>
                    <TextInputFocusable
                        ref={el => this.textInputFocusable = el}
                        multiline
                        textAlignVertical="top"
                        placeholder="Write something..."
                        placeholderTextColor={colors.textSupporting}
                        onChangeText={this.updateComment}
                        onKeyPress={this.triggerSubmitShortcut}
                        style={[styles.textInput, styles.textInputCompose, styles.flex4]}
                        defaultValue={this.props.comment || ''}
                        maxLines={16} // This is the same that slack has
                        onFocus={() => this.setIsFocused(true)}
                        onBlur={() => this.setIsFocused(false)}
                        shouldClear={this.state.textInputShouldClear}
                    />
                    <TouchableOpacity
                        style={[styles.chatItemSubmitButton, styles.buttonSuccess]}
                        onPress={this.submitForm}
                        underlayColor={colors.componentBG}
                    >
                        <Image
                            resizeMode="contain"
                            style={[styles.chatItemSubmitButtonIcon]}
                            source={sendIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}
ReportActionCompose.propTypes = propTypes;
ReportActionCompose.defaultProps = defaultProps;

export default withIon({
    comment: {
        key: ({reportID}) => `${IONKEYS.COLLECTION.REPORT_DRAFT_COMMENT}${reportID}`,
    },
})(ReportActionCompose);
